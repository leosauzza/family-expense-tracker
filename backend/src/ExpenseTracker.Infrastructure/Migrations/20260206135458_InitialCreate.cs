using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpenseTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Initial = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OldValue = table.Column<string>(type: "text", nullable: true),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Month = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MonthlyData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    WalletAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    DataCopiedFromPreviousMonth = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyData", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyData_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FixedExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyDataId = table.Column<Guid>(type: "uuid", nullable: false),
                    Detail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AmountARS = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AmountUSD = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FixedExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FixedExpenses_MonthlyData_MonthlyDataId",
                        column: x => x.MonthlyDataId,
                        principalTable: "MonthlyData",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SharedExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyDataId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaidByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Detail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AmountARS = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AmountUSD = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SharedExpenses_MonthlyData_MonthlyDataId",
                        column: x => x.MonthlyDataId,
                        principalTable: "MonthlyData",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SharedExpenses_Users_PaidByUserId",
                        column: x => x.PaidByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ThirdPartyExpenseLists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyDataId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThirdPartyExpenseLists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ThirdPartyExpenseLists_MonthlyData_MonthlyDataId",
                        column: x => x.MonthlyDataId,
                        principalTable: "MonthlyData",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ThirdPartyExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ThirdPartyExpenseListId = table.Column<Guid>(type: "uuid", nullable: false),
                    Detail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AmountARS = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AmountUSD = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThirdPartyExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ThirdPartyExpenses_ThirdPartyExpenseLists_ThirdPartyExpense~",
                        column: x => x.ThirdPartyExpenseListId,
                        principalTable: "ThirdPartyExpenseLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Color", "CreatedAt", "Initial", "Name", "Slug" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "#6366f1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "L", "Leo", "leo" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "#ec4899", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A", "Anto", "anto" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_UserId_CreatedAt",
                table: "ActivityLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FixedExpenses_MonthlyDataId",
                table: "FixedExpenses",
                column: "MonthlyDataId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyData_UserId_Year_Month",
                table: "MonthlyData",
                columns: new[] { "UserId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SharedExpenses_MonthlyDataId",
                table: "SharedExpenses",
                column: "MonthlyDataId");

            migrationBuilder.CreateIndex(
                name: "IX_SharedExpenses_PaidByUserId",
                table: "SharedExpenses",
                column: "PaidByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ThirdPartyExpenseLists_MonthlyDataId",
                table: "ThirdPartyExpenseLists",
                column: "MonthlyDataId");

            migrationBuilder.CreateIndex(
                name: "IX_ThirdPartyExpenses_ThirdPartyExpenseListId",
                table: "ThirdPartyExpenses",
                column: "ThirdPartyExpenseListId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Slug",
                table: "Users",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "FixedExpenses");

            migrationBuilder.DropTable(
                name: "SharedExpenses");

            migrationBuilder.DropTable(
                name: "ThirdPartyExpenses");

            migrationBuilder.DropTable(
                name: "ThirdPartyExpenseLists");

            migrationBuilder.DropTable(
                name: "MonthlyData");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
