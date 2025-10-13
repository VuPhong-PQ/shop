using Microsoft.EntityFrameworkCore;

namespace RetailPointBackend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        // Constructor không tham số cho migration design-time
        public AppDbContext() { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // Lấy connection string mặc định cho migration
                optionsBuilder.UseSqlServer("Server=TEST-PC\\KTEAM;Database=RetailPoint;User Id=sa;Password=123;MultipleActiveResultSets=True;TrustServerCertificate=True;");
            }
        }

    public DbSet<Product> Products { get; set; }
    public DbSet<ProductGroup> ProductGroups { get; set; }
    public DbSet<PaymentSettings> PaymentSettings { get; set; }
    public DbSet<QRSettings> QRSettings { get; set; }
    public DbSet<StoreInfo> StoreInfos { get; set; }
    public DbSet<TaxConfig> TaxConfigs { get; set; }
    public DbSet<PaymentMethodConfig> PaymentMethodConfigs { get; set; }
    public DbSet<PrintConfig> PrintConfigs { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<Store> Stores { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
    public DbSet<BackupHistory> BackupHistories { get; set; }
    public DbSet<BackupSettings> BackupSettings { get; set; }
    
    // E-Invoice tables
    public DbSet<EInvoice> EInvoices { get; set; }
    public DbSet<EInvoiceItem> EInvoiceItems { get; set; }
    public DbSet<EInvoiceConfig> EInvoiceConfigs { get; set; }
    
    // Discount tables
    public DbSet<Discount> Discounts { get; set; }
    public DbSet<OrderDiscount> OrderDiscounts { get; set; }
    }

}
