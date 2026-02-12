using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditCardImportAndSharedExpenseTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpenseType",
                table: "SharedExpenses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ExternalPartiesJson",
                table: "SharedExpenses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TargetUserId",
                table: "SharedExpenses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CreditCardExtractedExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyDataId = table.Column<Guid>(type: "uuid", nullable: false),
                    Detail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AmountARS = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AmountUSD = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ExtractedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditCardExtractedExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreditCardExtractedExpenses_MonthlyData_MonthlyDataId",
                        column: x => x.MonthlyDataId,
                        principalTable: "MonthlyData",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CreditCardExtractedExpenses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SharedExpenses_TargetUserId",
                table: "SharedExpenses",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditCardExtractedExpenses_MonthlyDataId",
                table: "CreditCardExtractedExpenses",
                column: "MonthlyDataId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditCardExtractedExpenses_UserId",
                table: "CreditCardExtractedExpenses",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_SharedExpenses_Users_TargetUserId",
                table: "SharedExpenses",
                column: "TargetUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SharedExpenses_Users_TargetUserId",
                table: "SharedExpenses");

            migrationBuilder.DropTable(
                name: "CreditCardExtractedExpenses");

            migrationBuilder.DropIndex(
                name: "IX_SharedExpenses_TargetUserId",
                table: "SharedExpenses");

            migrationBuilder.DropColumn(
                name: "ExpenseType",
                table: "SharedExpenses");

            migrationBuilder.DropColumn(
                name: "ExternalPartiesJson",
                table: "SharedExpenses");

            migrationBuilder.DropColumn(
                name: "TargetUserId",
                table: "SharedExpenses");
        }
    }
}
