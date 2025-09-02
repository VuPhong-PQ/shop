using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RetailPointBackend.Models
{
    public enum CustomerRank
    {
        Thuong,
        Premium,
        VIP
    }

    public class Customer
    {
        [Key]
        public int CustomerId { get; set; }
        public string? HoTen { get; set; }
        public string? SoDienThoai { get; set; }
        public string? Email { get; set; }
        public string? DiaChi { get; set; }
        public CustomerRank HangKhachHang { get; set; }

        public List<Order> Orders { get; set; } = new List<Order>();
        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
