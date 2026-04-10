using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TBPBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class addedimagemetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CameraAngle",
                table: "UserImages",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Count",
                table: "UserImages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "UserImages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImageIndex",
                table: "UserImages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModelName",
                table: "UserImages",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Width",
                table: "UserImages",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CameraAngle",
                table: "UserImages");

            migrationBuilder.DropColumn(
                name: "Count",
                table: "UserImages");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "UserImages");

            migrationBuilder.DropColumn(
                name: "ImageIndex",
                table: "UserImages");

            migrationBuilder.DropColumn(
                name: "ModelName",
                table: "UserImages");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "UserImages");
        }
    }
}
