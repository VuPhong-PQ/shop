using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetailPointBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductGroupIdToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductGroupId",
                table: "Products",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductGroupId",
                table: "Products");
        }
    }
}
