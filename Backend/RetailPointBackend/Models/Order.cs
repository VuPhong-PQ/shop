using System;
using System.Collections.Generic;

namespace RetailPointBackend.Models
{
    public class Order
    {
        public int OrderId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? CustomerName { get; set; }
        public decimal TotalAmount { get; set; }
        public int? CustomerId { get; set; }
        
        // Thêm các trường mới cho thông tin chi tiết
        public decimal SubTotal { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public string? PaymentMethod { get; set; } = "cash"; // cash, card, qr, ewallet
        public string? PaymentStatus { get; set; } = "pending"; // paid, pending, failed - default pending
        public string? Status { get; set; } = "pending"; // completed, pending, cancelled - default pending
        public string? OrderNumber { get; set; }
        public int? StaffId { get; set; } // Foreign Key to Staff
        public string? StoreId { get; set; }
        public string? Notes { get; set; }
        
        public Customer? Customer { get; set; }
        public Staff? Staff { get; set; } // Navigation property to Staff
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
