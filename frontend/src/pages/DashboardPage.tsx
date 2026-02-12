import { useEffect, useState, useCallback, useMemo } from 'react';
import { CreditCardImportWizard } from '../components/creditCardImport/CreditCardImportWizard';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { Header } from '../components/layout/Header';
import { WalletCard } from '../components/expenses/WalletCard';
import { CalculationDisplay } from '../components/expenses/CalculationDisplay';
import { TheyOweMe } from '../components/expenses/TheyOweMe';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ThirdPartyList } from '../components/expenses/ThirdPartyList';
import { SharedExpenseList } from '../components/expenses/SharedExpenseList';
import { ListTypeSelectorModal, type ListType } from '../components/expenses/ListTypeSelectorModal';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { SortableExpenseList, DragOverlayItem } from '../components/expenses/SortableExpenseList';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { monthlyDataService } from '../services/monthlyDataService';
import { sharedExpenseService, fixedExpenseService, thirdPartyService } from '../services/expenseService';
import { userService } from '../services/userService';
import { parseMonthYearFromUrl, formatMonthYearForUrl, getPreviousMonth, getNextMonth } from '../utils/date';
import { calculateFinalBalance } from '../utils/calculations';
import type { MonthlyData, SharedExpenseView, FixedExpense, SharedExpense, ThirdPartyExpense, VirtualListConfig } from '../types';

// Dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function DashboardPage() {
  const { userSlug, yearMonth } = useParams<{ userSlug: string; yearMonth: string }>();
  const navigate = useNavigate();
  const { currentUser, viewedUser, setViewedUserBySlug, isViewingOwnData } = useAuth();
  const { t } = useTranslation();

  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [sharedByOthers, setSharedByOthers] = useState<SharedExpenseView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showListTypeSelector, setShowListTypeSelector] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [isCalculationExpanded, setIsCalculationExpanded] = useState(false);
  const [virtualListConfigs, setVirtualListConfigs] = useState<VirtualListConfig[]>([]);
  const [showSharedExpenseModal, setShowSharedExpenseModal] = useState(false);
  const [sharedExpenseModalConfig, setSharedExpenseModalConfig] = useState<{
    type: 'ForSpecificSystemUser' | 'SplitWithExternalParties' | 'SplitWithAllSystemUsers';
    targetUserId?: string;
    externalParties?: string[];
  } | null>(null);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOrder, setListOrder] = useState<string[]>([]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCalculation = useCallback(() => {
    setIsCalculationExpanded(prev => !prev);
  }, []);

  // Parse year/month from URL or use current
  const { year, month } = yearMonth
    ? parseMonthYearFromUrl(yearMonth) || getCurrentMonthYear()
    : getCurrentMonthYear();

  function getCurrentMonthYear() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!userSlug) return;

      setIsLoading(true);

      // Set viewed user from URL
      await setViewedUserBySlug(userSlug);

      // Get user by slug to get ID
      const user = await userService.getBySlug(userSlug);
      if (!user) {
        navigate('/');
        return;
      }

      // Load monthly data
      const data = await monthlyDataService.get(user.id, year, month);
      setMonthlyData(data);

      // Check if we need to show copy modal
      if (!data.dataCopiedFromPreviousMonth && isNewMonthData(data)) {
        setShowCopyModal(true);
      }

      // Load shared expenses paid by others
      const othersExpenses = await sharedExpenseService.getPaidByOthers(user.id, year, month);
      setSharedByOthers(othersExpenses);

      // Load all users for calculation
      const users = await userService.getAll();
      setAllUsers(users);

      setIsLoading(false);
    };

    loadData();
  }, [userSlug, year, month, navigate, setViewedUserBySlug]);

  const isNewMonthData = (data: MonthlyData): boolean => {
    // If wallet is 0 and there are no expenses, consider it new
    return data.walletAmount === 0 && 
           data.fixedExpenses.length === 0 && 
           data.sharedExpensesPaidByUser.length === 0 &&
           data.thirdPartyExpenseLists.length === 0;
  };

  // Navigation
  const goToPreviousMonth = useCallback(() => {
    if (!userSlug) return;
    const prev = getPreviousMonth(year, month);
    navigate(`/${userSlug}/${formatMonthYearForUrl(prev.year, prev.month)}`);
  }, [userSlug, year, month, navigate]);

  const goToNextMonth = useCallback(() => {
    if (!userSlug) return;
    const next = getNextMonth(year, month);
    navigate(`/${userSlug}/${formatMonthYearForUrl(next.year, next.month)}`);
  }, [userSlug, year, month, navigate]);

  // Copy from previous month
  const handleCopyFromPrevious = async () => {
    if (!monthlyData) return;
    const updated = await monthlyDataService.copyFromPrevious(monthlyData.id);
    setMonthlyData(updated);
    setShowCopyModal(false);
  };

  // Wallet update
  const handleUpdateWallet = async (amount: number) => {
    if (!monthlyData) return;
    await monthlyDataService.updateWallet(monthlyData.id, amount);
    setMonthlyData({ ...monthlyData, walletAmount: amount });
  };

  // Fixed expenses handlers
  const handleAddFixedExpense = async (expense: Omit<FixedExpense, 'id'>) => {
    if (!monthlyData) return;
    const newExpense = await fixedExpenseService.create({
      ...expense,
      monthlyDataId: monthlyData.id
    });
    setMonthlyData({
      ...monthlyData,
      fixedExpenses: [...monthlyData.fixedExpenses, newExpense]
    });
  };

  const handleUpdateFixedExpense = async (id: string, expense: Partial<FixedExpense>) => {
    if (!monthlyData) return;
    await fixedExpenseService.update(id, expense);
    setMonthlyData({
      ...monthlyData,
      fixedExpenses: monthlyData.fixedExpenses.map(e => 
        e.id === id ? { ...e, ...expense } : e
      )
    });
  };

  const handleDeleteFixedExpense = async (id: string) => {
    if (!monthlyData) return;
    await fixedExpenseService.delete(id);
    setMonthlyData({
      ...monthlyData,
      fixedExpenses: monthlyData.fixedExpenses.filter(e => e.id !== id)
    });
  };

  const handleToggleFixedPaid = async (id: string, isPaid: boolean) => {
    if (!monthlyData) return;
    await fixedExpenseService.togglePaid(id, isPaid);
    setMonthlyData({
      ...monthlyData,
      fixedExpenses: monthlyData.fixedExpenses.map(e => 
        e.id === id ? { ...e, isPaid } : e
      )
    });
  };

  // Shared expenses handlers
  const handleAddSharedExpense = async (expense: Omit<SharedExpense, 'id'>) => {
    if (!monthlyData || !currentUser) return;
    const newExpense = await sharedExpenseService.create({
      ...expense,
      monthlyDataId: monthlyData.id,
      paidByUserId: currentUser.id
    });
    setMonthlyData({
      ...monthlyData,
      sharedExpensesPaidByUser: [...monthlyData.sharedExpensesPaidByUser, newExpense]
    });
  };

  const handleAddSharedExpenseFromModal = async (expenseData: { 
    detail: string; 
    amountARS: number; 
    amountUSD: number; 
    isPaid: boolean 
  }) => {
    if (!monthlyData || !currentUser || !sharedExpenseModalConfig) return;

    const newExpense = await sharedExpenseService.create({
      ...expenseData,
      monthlyDataId: monthlyData.id,
      paidByUserId: currentUser.id,
      expenseType: sharedExpenseModalConfig.type,
      targetUserId: sharedExpenseModalConfig.targetUserId,
      externalParties: sharedExpenseModalConfig.externalParties
    });

    setMonthlyData({
      ...monthlyData,
      sharedExpensesPaidByUser: [...monthlyData.sharedExpensesPaidByUser, newExpense]
    });

    // Close modal and reset config
    setShowSharedExpenseModal(false);
    setSharedExpenseModalConfig(null);
  };

  const handleUpdateSharedExpense = async (id: string, expense: Partial<SharedExpense>) => {
    if (!monthlyData) return;
    await sharedExpenseService.update(id, expense);
    setMonthlyData({
      ...monthlyData,
      sharedExpensesPaidByUser: monthlyData.sharedExpensesPaidByUser.map(e => 
        e.id === id ? { ...e, ...expense } : e
      )
    });
  };

  const handleDeleteSharedExpense = async (id: string) => {
    if (!monthlyData) return;
    await sharedExpenseService.delete(id);
    setMonthlyData({
      ...monthlyData,
      sharedExpensesPaidByUser: monthlyData.sharedExpensesPaidByUser.filter(e => e.id !== id)
    });
  };

  const handleToggleSharedPaid = async (id: string, isPaid: boolean) => {
    if (!monthlyData) return;
    await sharedExpenseService.togglePaid(id, isPaid);
    setMonthlyData({
      ...monthlyData,
      sharedExpensesPaidByUser: monthlyData.sharedExpensesPaidByUser.map(e => 
        e.id === id ? { ...e, isPaid } : e
      )
    });
  };

  // Third party list handlers
  const handleAddThirdPartyList = async () => {
    // Show the list type selector modal instead of directly creating
    setShowListTypeSelector(true);
  };

  const handleListTypeSelected = async (
    type: ListType, 
    config: { targetUserId?: string; externalParties?: string[] }
  ) => {
    if (!monthlyData || !currentUser) return;

    switch (type) {
      case 'externalThirdParty':
        // Create traditional third party list
        const newList = await thirdPartyService.createList({
          monthlyDataId: monthlyData.id,
          name: t('dashboard.thirdParty.defaultName'),
          order: monthlyData.thirdPartyExpenseLists.length + 1
        });
        setMonthlyData({
          ...monthlyData,
          thirdPartyExpenseLists: [...monthlyData.thirdPartyExpenseLists, newList]
        });
        break;

      case 'systemUser': {
        // Create a virtual list configuration for system user expenses
        if (config.targetUserId) {
          const targetUser = allUsers.find(u => u.id === config.targetUserId);
          const virtualListId = `systemUser-${config.targetUserId}-${Date.now()}`;
          const newVirtualList: VirtualListConfig = {
            id: virtualListId,
            type: 'systemUser',
            targetUserId: config.targetUserId,
            targetUserName: targetUser?.name || 'Unknown'
          };
          setVirtualListConfigs(prev => [...prev, newVirtualList]);
          setSharedExpenseModalConfig({
            type: 'ForSpecificSystemUser',
            targetUserId: config.targetUserId
          });
          setShowSharedExpenseModal(true);
        }
        break;
      }

      case 'externalShared': {
        // Create a virtual list configuration for external shared expenses
        if (config.externalParties && config.externalParties.length > 0) {
          const virtualListId = `externalShared-${Date.now()}`;
          const newVirtualList: VirtualListConfig = {
            id: virtualListId,
            type: 'externalShared',
            externalParties: config.externalParties
          };
          setVirtualListConfigs(prev => [...prev, newVirtualList]);
          setSharedExpenseModalConfig({
            type: 'SplitWithExternalParties',
            externalParties: config.externalParties
          });
          setShowSharedExpenseModal(true);
        }
        break;
      }
    }

    setShowListTypeSelector(false);
  };

  const handleUpdateListName = async (id: string, name: string) => {
    if (!monthlyData) return;
    await thirdPartyService.updateListName(id, name);
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.map(l => 
        l.id === id ? { ...l, name } : l
      )
    });
  };

  const handleDeleteList = async (id: string) => {
    if (!monthlyData) return;
    await thirdPartyService.deleteList(id);
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.filter(l => l.id !== id)
    });
  };

  const handleAddThirdPartyExpense = async (
    listId: string, 
    expense: Omit<ThirdPartyExpense, 'id' | 'thirdPartyExpenseListId'>
  ) => {
    if (!monthlyData) return;
    const newExpense = await thirdPartyService.createExpense({
      ...expense,
      thirdPartyExpenseListId: listId
    });
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.map(l => 
        l.id === listId 
          ? { ...l, expenses: [...l.expenses, newExpense] }
          : l
      )
    });
  };

  const handleUpdateThirdPartyExpense = async (id: string, expense: Partial<ThirdPartyExpense>) => {
    if (!monthlyData) return;
    await thirdPartyService.updateExpense(id, expense);
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.map(l => ({
        ...l,
        expenses: l.expenses.map(e => e.id === id ? { ...e, ...expense } : e)
      }))
    });
  };

  const handleDeleteThirdPartyExpense = async (id: string) => {
    if (!monthlyData) return;
    await thirdPartyService.deleteExpense(id);
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.map(l => ({
        ...l,
        expenses: l.expenses.filter(e => e.id !== id)
      }))
    });
  };

  const handleToggleThirdPartyPaid = async (id: string, isPaid: boolean) => {
    if (!monthlyData) return;
    await thirdPartyService.toggleExpensePaid(id, isPaid);
    setMonthlyData({
      ...monthlyData,
      thirdPartyExpenseLists: monthlyData.thirdPartyExpenseLists.map(l => ({
        ...l,
        expenses: l.expenses.map(e => e.id === id ? { ...e, isPaid } : e)
      }))
    });
  };

  // Group shared expenses by type
  const groupedSharedExpenses = useMemo(() => {
    if (!monthlyData) return {
      systemShared: [],
      systemUserGroups: [] as { targetUserId: string; targetUserName: string; expenses: SharedExpense[]; configId?: string }[],
      externalSharedGroups: [] as { externalParties: string[]; expenses: SharedExpense[]; configId?: string }[]
    };

    const systemShared: SharedExpense[] = [];
    const systemUserMap = new Map<string, { expenses: SharedExpense[]; configId?: string }>();
    const externalSharedMap = new Map<string, { expenses: SharedExpense[]; configId?: string }>();

    // First, add virtual list configs to the maps (so empty lists are shown)
    virtualListConfigs.forEach(config => {
      if (config.type === 'systemUser' && config.targetUserId) {
        systemUserMap.set(config.targetUserId, { expenses: [], configId: config.id });
      } else if (config.type === 'externalShared' && config.externalParties) {
        const key = config.externalParties.sort().join(',');
        externalSharedMap.set(key, { expenses: [], configId: config.id });
      }
    });

    monthlyData.sharedExpensesPaidByUser.forEach(expense => {
      const type = expense.expenseType || 'SplitWithAllSystemUsers';
      
      switch (type) {
        case 'SplitWithAllSystemUsers':
          systemShared.push(expense);
          break;
        case 'ForSpecificSystemUser':
          if (expense.targetUserId) {
            const existing = systemUserMap.get(expense.targetUserId);
            if (existing) {
              existing.expenses.push(expense);
            } else {
              systemUserMap.set(expense.targetUserId, { expenses: [expense] });
            }
          }
          break;
        case 'SplitWithExternalParties':
          const key = (expense.externalParties || []).sort().join(',');
          if (key) {
            const existing = externalSharedMap.get(key);
            if (existing) {
              existing.expenses.push(expense);
            } else {
              externalSharedMap.set(key, { expenses: [expense] });
            }
          } else {
            // Fallback for expenses without external parties specified
            const fallbackKey = 'external';
            const existing = externalSharedMap.get(fallbackKey);
            if (existing) {
              existing.expenses.push(expense);
            } else {
              externalSharedMap.set(fallbackKey, { expenses: [expense] });
            }
          }
          break;
      }
    });

    const systemUserGroups = Array.from(systemUserMap.entries()).map(([targetUserId, data]) => ({
      targetUserId,
      targetUserName: allUsers.find(u => u.id === targetUserId)?.name || 'Unknown',
      expenses: data.expenses,
      configId: data.configId
    }));

    const externalSharedGroups = Array.from(externalSharedMap.entries()).map(([key, data]) => ({
      externalParties: key === 'external' ? ['External'] : key.split(','),
      expenses: data.expenses,
      configId: data.configId
    }));

    return { systemShared, systemUserGroups, externalSharedGroups };
  }, [monthlyData, allUsers, virtualListConfigs]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setListOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Update order in backend for ThirdParty lists
        const thirdPartyItems = newOrder
          .map((id, index) => {
            const list = monthlyData?.thirdPartyExpenseLists.find(l => l.id === id);
            if (list) {
              return { id, order: index };
            }
            return null;
          })
          .filter((item): item is { id: string; order: number } => item !== null);
        
        if (thirdPartyItems.length > 0) {
          thirdPartyService.reorderLists(thirdPartyItems).catch(console.error);
        }
        
        return newOrder;
      });
    }
    
    setActiveId(null);
  };

  // Build ordered list of all list IDs
  const orderedListIds = useMemo(() => {
    if (!monthlyData) return [];
    
    // If we have a custom order, use it
    if (listOrder.length > 0) {
      return listOrder;
    }
    
    // Otherwise, build default order
    const ids: string[] = [];
    
    // Fixed expenses (always first)
    ids.push('fixed');
    
    // System shared expenses
    if (groupedSharedExpenses.systemShared.length > 0) {
      ids.push('shared-system');
    }
    
    // System user groups
    groupedSharedExpenses.systemUserGroups.forEach(group => {
      ids.push(`systemUser-${group.targetUserId}`);
    });
    
    // External shared groups
    groupedSharedExpenses.externalSharedGroups.forEach((_group, index) => {
      ids.push(`externalShared-${index}`);
    });
    
    // Third party lists (sorted by order)
    const sortedThirdParty = [...monthlyData.thirdPartyExpenseLists]
      .sort((a, b) => a.order - b.order);
    sortedThirdParty.forEach(list => {
      ids.push(list.id);
    });
    
    // Shared by others (read-only, at the end)
    if (sharedByOthers.length > 0) {
      ids.push('shared-others');
    }
    
    return ids;
  }, [monthlyData, listOrder, groupedSharedExpenses, sharedByOthers]);

  // Initialize list order on first load
  useEffect(() => {
    if (monthlyData && listOrder.length === 0) {
      const ids: string[] = [];
      ids.push('fixed');
      
      if (groupedSharedExpenses.systemShared.length > 0) {
        ids.push('shared-system');
      }
      
      groupedSharedExpenses.systemUserGroups.forEach(group => {
        ids.push(`systemUser-${group.targetUserId}`);
      });
      
      groupedSharedExpenses.externalSharedGroups.forEach((_group, index) => {
        ids.push(`externalShared-${index}`);
      });
      
      const sortedThirdParty = [...monthlyData.thirdPartyExpenseLists]
        .sort((a, b) => a.order - b.order);
      sortedThirdParty.forEach(list => {
        ids.push(list.id);
      });
      
      if (sharedByOthers.length > 0) {
        ids.push('shared-others');
      }
      
      setListOrder(ids);
    }
  }, [monthlyData, groupedSharedExpenses, sharedByOthers]);

  if (isLoading || !monthlyData || !viewedUser) {
    return (
      <div className={styles.loading}>
        {t('common.loading')}
      </div>
    );
  }

  const calculation = calculateFinalBalance(monthlyData, sharedByOthers, allUsers.length || 2);

  const otherUserName = allUsers.find(u => u.id !== viewedUser.id)?.name || '';

  // Function to render a list by its ID
  const renderListById = (listId: string): React.ReactNode => {
    // Fixed expenses
    if (listId === 'fixed') {
      return (
        <ExpenseList
          title={t('dashboard.fixedExpenses.title')}
          expenses={monthlyData.fixedExpenses}
          isReadOnly={!isViewingOwnData}
          onAdd={handleAddFixedExpense as unknown as (expense: Omit<import('../types').Expense, 'id'>) => void}
          onUpdate={handleUpdateFixedExpense as unknown as (id: string, expense: Partial<import('../types').Expense>) => void}
          onDelete={handleDeleteFixedExpense}
          onTogglePaid={handleToggleFixedPaid}
          addButtonText={t('dashboard.fixedExpenses.add')}
        />
      );
    }

    // System shared expenses
    if (listId === 'shared-system') {
      return (
        <SharedExpenseList
          title={t('dashboard.sharedExpenses.myShared')}
          listType="systemShared"
          expenses={groupedSharedExpenses.systemShared}
          isReadOnly={!isViewingOwnData}
          onAdd={(expense) => handleAddSharedExpense({ ...expense, expenseType: 'SplitWithAllSystemUsers' })}
          onUpdate={handleUpdateSharedExpense}
          onDelete={handleDeleteSharedExpense}
          onTogglePaid={handleToggleSharedPaid}
        />
      );
    }

    // System user groups
    if (listId.startsWith('systemUser-')) {
      const targetUserId = listId.replace('systemUser-', '');
      const group = groupedSharedExpenses.systemUserGroups.find(g => g.targetUserId === targetUserId);
      if (!group) return null;
      return (
        <SharedExpenseList
          title={t('dashboard.sharedExpenseList.systemUserTitle', { name: group.targetUserName })}
          subtitle={t('dashboard.sharedExpenseList.forUser', { name: group.targetUserName })}
          listType="systemUser"
          targetUserName={group.targetUserName}
          expenses={group.expenses}
          isReadOnly={!isViewingOwnData}
          onAdd={(expense) => handleAddSharedExpense({ 
            ...expense, 
            expenseType: 'ForSpecificSystemUser',
            targetUserId: group.targetUserId
          })}
          onUpdate={handleUpdateSharedExpense}
          onDelete={handleDeleteSharedExpense}
          onTogglePaid={handleToggleSharedPaid}
        />
      );
    }

    // External shared groups
    if (listId.startsWith('externalShared-')) {
      const index = parseInt(listId.replace('externalShared-', ''));
      const group = groupedSharedExpenses.externalSharedGroups[index];
      if (!group) return null;
      return (
        <SharedExpenseList
          title={t('dashboard.sharedExpenseList.externalSharedTitle')}
          subtitle={t('dashboard.sharedExpenseList.withExternal', { parties: group.externalParties.join(', ') })}
          listType="externalShared"
          externalParties={group.externalParties}
          expenses={group.expenses}
          isReadOnly={!isViewingOwnData}
          onAdd={(expense) => handleAddSharedExpense({ 
            ...expense, 
            expenseType: 'SplitWithExternalParties',
            externalParties: group.externalParties
          })}
          onUpdate={handleUpdateSharedExpense}
          onDelete={handleDeleteSharedExpense}
          onTogglePaid={handleToggleSharedPaid}
        />
      );
    }

    // Shared by others (read-only)
    if (listId === 'shared-others') {
      return (
        <ExpenseList
          title={t('dashboard.sharedExpenses.othersShared', { name: otherUserName })}
          expenses={sharedByOthers}
          isReadOnly={true}
          showPaidCheckbox={false}
          onAdd={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
          onTogglePaid={() => {}}
        />
      );
    }

    // Third party lists
    const thirdPartyList = monthlyData.thirdPartyExpenseLists.find(l => l.id === listId);
    if (thirdPartyList) {
      return (
        <ThirdPartyList
          list={thirdPartyList}
          isReadOnly={!isViewingOwnData}
          onUpdateName={handleUpdateListName}
          onDeleteList={handleDeleteList}
          onAddExpense={handleAddThirdPartyExpense}
          onUpdateExpense={handleUpdateThirdPartyExpense}
          onDeleteExpense={handleDeleteThirdPartyExpense}
          onToggleExpensePaid={handleToggleThirdPartyPaid}
        />
      );
    }

    return null;
  };

  return (
    <div className={styles.page}>
      <Header
        year={year}
        month={month}
        onPrevMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onAddCreditCard={() => setShowImportWizard(true)}
        onAddList={isViewingOwnData ? handleAddThirdPartyList : undefined}
      />

      <main className={styles.main}>
        <div className={styles.topSection}>
          <div className={styles.walletSection}>
            <WalletCard
              amount={monthlyData.walletAmount}
              isReadOnly={!isViewingOwnData}
              onUpdate={handleUpdateWallet}
            />
          </div>
          <div className={styles.calculationSection}>
            <CalculationDisplay
              calculation={calculation}
              totalSystemUsers={allUsers.length || 2}
              isExpanded={isCalculationExpanded}
              onToggle={toggleCalculation}
            />
          </div>
          <div className={styles.theyOweSection}>
            <TheyOweMe
              thirdPartyLists={monthlyData.thirdPartyExpenseLists}
              sharedByUser={monthlyData.sharedExpensesPaidByUser}
              sharedByOthers={sharedByOthers}
              totalSystemUsers={allUsers.length || 2}
              isExpanded={isCalculationExpanded}
              onToggle={toggleCalculation}
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.listsSection}>
            <SortableContext
              items={orderedListIds}
              strategy={verticalListSortingStrategy}
            >
              {orderedListIds.map((listId) => (
                <SortableExpenseList
                  key={listId}
                  id={listId}
                  isReadOnly={!isViewingOwnData || listId === 'shared-others'}
                >
                  {renderListById(listId)}
                </SortableExpenseList>
              ))}
            </SortableContext>

            {/* Add Shared Expense Button (when no shared expenses exist) */}
            {monthlyData.sharedExpensesPaidByUser.length === 0 && isViewingOwnData && (
              <Button
                variant="secondary"
                onClick={() => handleAddSharedExpense({ 
                  detail: '', 
                  amountARS: 0, 
                  amountUSD: 0, 
                  isPaid: false,
                  monthlyDataId: monthlyData.id,
                  paidByUserId: currentUser?.id || '',
                  expenseType: 'SplitWithAllSystemUsers'
                })}
                className={styles.addListButton}
              >
                {t('dashboard.sharedExpenses.add')}
              </Button>
            )}
          </div>

          <DragOverlay>
            {activeId ? (
              <DragOverlayItem>
                {renderListById(activeId)}
              </DragOverlayItem>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Copy from Previous Month Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title={t('dashboard.copyFromPrevious.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCopyModal(false)}>
              {t('dashboard.copyFromPrevious.no')}
            </Button>
            <Button onClick={handleCopyFromPrevious}>
              {t('dashboard.copyFromPrevious.yes')}
            </Button>
          </>
        }
      >
        <p>{t('dashboard.copyFromPrevious.message')}</p>
      </Modal>

      {/* List Type Selector Modal */}
      {currentUser && (
        <ListTypeSelectorModal
          isOpen={showListTypeSelector}
          onClose={() => setShowListTypeSelector(false)}
          onConfirm={handleListTypeSelected}
          systemUsers={allUsers}
          currentUserId={currentUser.id}
        />
      )}

      {/* Shared Expense Modal for Virtual Lists */}
      <ExpenseModal
        isOpen={showSharedExpenseModal}
        onClose={() => {
          setShowSharedExpenseModal(false);
          setSharedExpenseModalConfig(null);
        }}
        onSubmit={handleAddSharedExpenseFromModal}
        title={sharedExpenseModalConfig?.type === 'ForSpecificSystemUser' 
          ? t('dashboard.sharedExpenseList.systemUserTitle', { name: allUsers.find(u => u.id === sharedExpenseModalConfig.targetUserId)?.name || '' })
          : t('dashboard.sharedExpenseList.externalSharedTitle')
        }
      />

      {/* Credit Card Import Wizard */}
      {monthlyData && (
        <CreditCardImportWizard
          isOpen={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          monthlyDataId={monthlyData.id}
          userId={currentUser?.id || ''}
          systemUsers={allUsers}
          onImportComplete={() => {
            // Refresh data after import
            setShowImportWizard(false);
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </div>
  );
}
