using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncMovimientoAndTarea : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimiento_Expedientes_ExpedienteId",
                table: "Movimiento");

            migrationBuilder.DropForeignKey(
                name: "FK_Tarea_Expedientes_ExpedienteId",
                table: "Tarea");

            migrationBuilder.DropForeignKey(
                name: "FK_Tarea_Users_UserId",
                table: "Tarea");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tarea",
                table: "Tarea");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Movimiento",
                table: "Movimiento");

            migrationBuilder.RenameTable(
                name: "Tarea",
                newName: "Tareas");

            migrationBuilder.RenameTable(
                name: "Movimiento",
                newName: "Movimientos");

            migrationBuilder.RenameIndex(
                name: "IX_Tarea_UserId",
                table: "Tareas",
                newName: "IX_Tareas_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Tarea_ExpedienteId",
                table: "Tareas",
                newName: "IX_Tareas_ExpedienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Movimiento_ExpedienteId",
                table: "Movimientos",
                newName: "IX_Movimientos_ExpedienteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tareas",
                table: "Tareas",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Movimientos",
                table: "Movimientos",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimientos_Expedientes_ExpedienteId",
                table: "Movimientos",
                column: "ExpedienteId",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tareas_Expedientes_ExpedienteId",
                table: "Tareas",
                column: "ExpedienteId",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tareas_Users_UserId",
                table: "Tareas",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimientos_Expedientes_ExpedienteId",
                table: "Movimientos");

            migrationBuilder.DropForeignKey(
                name: "FK_Tareas_Expedientes_ExpedienteId",
                table: "Tareas");

            migrationBuilder.DropForeignKey(
                name: "FK_Tareas_Users_UserId",
                table: "Tareas");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tareas",
                table: "Tareas");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Movimientos",
                table: "Movimientos");

            migrationBuilder.RenameTable(
                name: "Tareas",
                newName: "Tarea");

            migrationBuilder.RenameTable(
                name: "Movimientos",
                newName: "Movimiento");

            migrationBuilder.RenameIndex(
                name: "IX_Tareas_UserId",
                table: "Tarea",
                newName: "IX_Tarea_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Tareas_ExpedienteId",
                table: "Tarea",
                newName: "IX_Tarea_ExpedienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Movimientos_ExpedienteId",
                table: "Movimiento",
                newName: "IX_Movimiento_ExpedienteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tarea",
                table: "Tarea",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Movimiento",
                table: "Movimiento",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimiento_Expedientes_ExpedienteId",
                table: "Movimiento",
                column: "ExpedienteId",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tarea_Expedientes_ExpedienteId",
                table: "Tarea",
                column: "ExpedienteId",
                principalTable: "Expedientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tarea_Users_UserId",
                table: "Tarea",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
