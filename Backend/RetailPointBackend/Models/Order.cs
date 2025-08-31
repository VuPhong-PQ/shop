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
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }

}
