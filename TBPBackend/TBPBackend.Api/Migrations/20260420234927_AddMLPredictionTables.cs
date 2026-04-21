using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TBPBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMLPredictionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImagePredictions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserImageId = table.Column<long>(type: "bigint", nullable: false),
                    NumLesions = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImagePredictions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImagePredictions_UserImages_UserImageId",
                        column: x => x.UserImageId,
                        principalTable: "UserImages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LesionDetections",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ImagePredictionId = table.Column<long>(type: "bigint", nullable: false),
                    LesionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    BoxX1 = table.Column<float>(type: "real", nullable: false),
                    BoxY1 = table.Column<float>(type: "real", nullable: false),
                    BoxX2 = table.Column<float>(type: "real", nullable: false),
                    BoxY2 = table.Column<float>(type: "real", nullable: false),
                    Score = table.Column<float>(type: "real", nullable: false),
                    PolygonMask = table.Column<string>(type: "text", nullable: false),
                    AnatomicalSite = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    PrevLesionId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    RelativeSizeChange = table.Column<float>(type: "real", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LesionDetections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LesionDetections_ImagePredictions_ImagePredictionId",
                        column: x => x.ImagePredictionId,
                        principalTable: "ImagePredictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImagePredictions_UserImageId",
                table: "ImagePredictions",
                column: "UserImageId");

            migrationBuilder.CreateIndex(
                name: "IX_LesionDetections_ImagePredictionId",
                table: "LesionDetections",
                column: "ImagePredictionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LesionDetections");

            migrationBuilder.DropTable(
                name: "ImagePredictions");
        }
    }
}
