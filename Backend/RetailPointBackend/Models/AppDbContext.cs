using Microsoft.EntityFrameworkCore;

namespace RetailPointBackend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<PaymentSettings> PaymentSettings { get; set; }
    }

}
