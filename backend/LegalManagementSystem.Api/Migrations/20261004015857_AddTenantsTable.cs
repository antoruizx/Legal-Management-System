using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Tareas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Movimientos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Expedientes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Documentos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Clientes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Slug = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "Id", "Name", "Slug", "CreatedAt", "Active" },
                values: new object[] { 1, "Estudio Jurídico", "estudio-juridico", DateTime.UtcNow, true });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Tareas_TenantId",
                table: "Tareas",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimientos_TenantId",
                table: "Movimientos",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Expedientes_TenantId",
                table: "Expedientes",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Documentos_TenantId",
                table: "Documentos",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_TenantId",
                table: "Clientes",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Slug",
                table: "Tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Tenants_TenantId",
                table: "Clientes",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Documentos_Tenants_TenantId",
                table: "Documentos",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Expedientes_Tenants_TenantId",
                table: "Expedientes",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Movimientos_Tenants_TenantId",
                table: "Movimientos",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tareas_Tenants_TenantId",
                table: "Tareas",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Tenants_TenantId",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Documentos_Tenants_TenantId",
                table: "Documentos");

            migrationBuilder.DropForeignKey(
                name: "FK_Expedientes_Tenants_TenantId",
                table: "Expedientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Movimientos_Tenants_TenantId",
                table: "Movimientos");

            migrationBuilder.DropForeignKey(
                name: "FK_Tareas_Tenants_TenantId",
                table: "Tareas");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Tareas_TenantId",
                table: "Tareas");

            migrationBuilder.DropIndex(
                name: "IX_Movimientos_TenantId",
                table: "Movimientos");

            migrationBuilder.DropIndex(
                name: "IX_Expedientes_TenantId",
                table: "Expedientes");

            migrationBuilder.DropIndex(
                name: "IX_Documentos_TenantId",
                table: "Documentos");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_TenantId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Tareas");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Movimientos");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Expedientes");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Documentos");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Clientes");
        }
    }
}


