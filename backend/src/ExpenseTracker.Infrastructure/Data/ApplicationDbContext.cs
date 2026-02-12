using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<MonthlyData> MonthlyData => Set<MonthlyData>();
    public DbSet<FixedExpense> FixedExpenses => Set<FixedExpense>();
    public DbSet<SharedExpense> SharedExpenses => Set<SharedExpense>();
    public DbSet<ThirdPartyExpenseList> ThirdPartyExpenseLists => Set<ThirdPartyExpenseList>();
    public DbSet<ThirdPartyExpense> ThirdPartyExpenses => Set<ThirdPartyExpense>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<CreditCardExtractedExpense> CreditCardExtractedExpenses => Set<CreditCardExtractedExpense>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Initial).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(20);
        });

        // MonthlyData configuration
        modelBuilder.Entity<MonthlyData>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Year, e.Month }).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FixedExpense configuration
        modelBuilder.Entity<FixedExpense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.MonthlyData)
                .WithMany(md => md.FixedExpenses)
                .HasForeignKey(e => e.MonthlyDataId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Detail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AmountARS).HasPrecision(18, 2);
            entity.Property(e => e.AmountUSD).HasPrecision(18, 2);
        });

        // SharedExpense configuration
        modelBuilder.Entity<SharedExpense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.MonthlyData)
                .WithMany(md => md.SharedExpensesPaidByUser)
                .HasForeignKey(e => e.MonthlyDataId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PaidByUser)
                .WithMany()
                .HasForeignKey(e => e.PaidByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.TargetUser)
                .WithMany()
                .HasForeignKey(e => e.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Detail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AmountARS).HasPrecision(18, 2);
            entity.Property(e => e.AmountUSD).HasPrecision(18, 2);
            entity.Property(e => e.ExpenseType).IsRequired();
            entity.Property(e => e.ExternalPartiesJson);
        });

        // CreditCardExtractedExpense configuration
        modelBuilder.Entity<CreditCardExtractedExpense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.MonthlyData)
                .WithMany()
                .HasForeignKey(e => e.MonthlyDataId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Detail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AmountARS).HasPrecision(18, 2);
            entity.Property(e => e.AmountUSD).HasPrecision(18, 2);
            entity.Property(e => e.ExtractedAt).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
        });

        // ThirdPartyExpenseList configuration
        modelBuilder.Entity<ThirdPartyExpenseList>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.MonthlyData)
                .WithMany(md => md.ThirdPartyExpenseLists)
                .HasForeignKey(e => e.MonthlyDataId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        // ThirdPartyExpense configuration
        modelBuilder.Entity<ThirdPartyExpense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ThirdPartyExpenseList)
                .WithMany(tpl => tpl.Expenses)
                .HasForeignKey(e => e.ThirdPartyExpenseListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Detail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AmountARS).HasPrecision(18, 2);
            entity.Property(e => e.AmountUSD).HasPrecision(18, 2);
        });

        // ActivityLog configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.CreatedAt });
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.EntityType).HasMaxLength(100);
            entity.Property(e => e.EntityId).HasMaxLength(100);
        });

        // Seed data
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var leoId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var antoId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = leoId,
                Name = "Leo",
                Slug = "leo",
                Initial = "L",
                Color = "#6366f1",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = antoId,
                Name = "Anto",
                Slug = "anto",
                Initial = "A",
                Color = "#ec4899",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
