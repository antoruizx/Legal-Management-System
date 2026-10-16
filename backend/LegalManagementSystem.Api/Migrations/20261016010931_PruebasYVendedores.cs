using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class PruebasYVendedores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsVendedor",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PruebaHasta",
                table: "Tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VendedorId",
                table: "Tenants",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CodigosInvitacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Codigo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VendedorId = table.Column<int>(type: "integer", nullable: false),
                    CreadoEl = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VenceEl = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsadoEl = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodigosInvitacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CodigosInvitacion_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CodigosInvitacion_Users_VendedorId",
                        column: x => x.VendedorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_VendedorId",
                table: "Tenants",
                column: "VendedorId");

            migrationBuilder.CreateIndex(
                name: "IX_CodigosInvitacion_Codigo",
                table: "CodigosInvitacion",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CodigosInvitacion_TenantId",
                table: "CodigosInvitacion",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CodigosInvitacion_VendedorId",
                table: "CodigosInvitacion",
                column: "VendedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_Users_VendedorId",
                table: "Tenants",
                column: "VendedorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_Users_VendedorId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "CodigosInvitacion");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_VendedorId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "EsVendedor",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PruebaHasta",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "VendedorId",
                table: "Tenants");
        }
    }
}
