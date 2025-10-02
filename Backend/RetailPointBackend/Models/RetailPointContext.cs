using Microsoft.EntityFrameworkCore;

namespace RetailPointBackend.Models
{
    public class RetailPointContext : DbContext
    {
        public RetailPointContext(DbContextOptions<RetailPointContext> options) : base(options) { }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductGroup> ProductGroups { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Customer> Customers { get; set; }
    }

    public class Category
    {
        public int CategoryId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? ParentId { get; set; }
        public bool IsVisible { get; set; }
    }

    // ...existing code...

    public class Product
    {
        public int ProductId { get; set; }
        public string? Name { get; set; }
        public string? Barcode { get; set; }
        public int? CategoryId { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("productGroupId")]
        public int? ProductGroupId { get; set; } // Nhóm sản phẩm
        public decimal Price { get; set; }
        public decimal? CostPrice { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string? Unit { get; set; }
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
    }
}
