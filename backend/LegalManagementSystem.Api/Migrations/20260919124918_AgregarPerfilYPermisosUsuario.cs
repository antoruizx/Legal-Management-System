using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarPerfilYPermisosUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PuedeEditarExpedientes",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "Users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PuedeEditarExpedientes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "Users");
        }
    }
}
