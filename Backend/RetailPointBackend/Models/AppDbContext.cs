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
        public DbSet<PaymentSettings> PaymentSettings { get; set; }
    public DbSet<StoreInfo> StoreInfos { get; set; }
    public DbSet<TaxConfig> TaxConfigs { get; set; }
    public DbSet<PaymentMethodConfig> PaymentMethodConfigs { get; set; }
    public DbSet<PrintConfig> PrintConfigs { get; set; }
    }

}
