using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarUsuarioAMovimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Movimientos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_UserId",
                table: "Movimientos",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimientos_Users_UserId",
                table: "Movimientos",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimientos_Users_UserId",
                table: "Movimientos");

            migrationBuilder.DropIndex(
                name: "IX_Movimientos_UserId",
                table: "Movimientos");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Movimientos");
        }
    }
}
