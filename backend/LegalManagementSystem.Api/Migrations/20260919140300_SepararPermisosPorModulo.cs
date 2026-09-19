using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class SepararPermisosPorModulo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PuedeEditarClientes",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PuedeEditarTareas",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PuedeEliminarClientes",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PuedeEliminarExpedientes",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PuedeEliminarTareas",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PuedeEditarClientes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PuedeEditarTareas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PuedeEliminarClientes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PuedeEliminarExpedientes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PuedeEliminarTareas",
                table: "Users");
        }
    }
}
