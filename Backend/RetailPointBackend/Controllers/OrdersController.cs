using Microsoft.AspNetCore.Mvc;
using RetailPointBackend.Models;
using System.Linq;
using System.Text.Json;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly RetailPointContext _context;
        private readonly AppDbContext _notificationContext;
        
        public OrdersController(RetailPointContext context, AppDbContext notificationContext)
        {
            _context = context;
            _notificationContext = notificationContext;
        }

        [HttpPost]
        public IActionResult CreateOrder(
            [FromForm] string? orderNumber,
            [FromForm] int? customerId,
            [FromForm] string? cashierId,
            [FromForm] string? storeId,
            [FromForm] string? subtotal,
            [FromForm] string? taxAmount,
            [FromForm] string? discountAmount,
            [FromForm] string? total,
            [FromForm] string? paymentMethod,
            [FromForm] string? paymentStatus,
            [FromForm] string? status)
        {
            // Lấy danh sách sản phẩm từ form-data
            var items = new List<OrderItem>();
            foreach (var key in Request.Form.Keys)
            {
                if (key.StartsWith("items[") && key.Contains("]"))
                {
                    var idxStart = key.IndexOf('[') + 1;
                    var idxEnd = key.IndexOf(']');
                    var idx = int.Parse(key.Substring(idxStart, idxEnd - idxStart));
                    while (items.Count <= idx) items.Add(new OrderItem());
                    var field = key.Substring(idxEnd + 2); // .field
                    if (field.StartsWith(".")) field = field.Substring(1); // remove leading dot
                    var value = Request.Form[key];
                    switch (field)
                    {
                        case "productId": items[idx].ProductId = int.TryParse(value, out var pid) ? pid : 0; break;
                        case "productName": items[idx].ProductName = value; break;
                        case "quantity": items[idx].Quantity = int.TryParse(value, out var qty) ? qty : 1; break;
                        case "unitPrice": items[idx].Price = decimal.TryParse(value, out var pr) ? pr : 0; break;
                        case "totalPrice": items[idx].TotalPrice = decimal.TryParse(value, out var tp) ? tp : 0; break;
                    }
                }
            }
            if (!items.Any()) return BadRequest("Order or items missing");
            var order = new Order
            {
                CustomerId = customerId,
                OrderId = 0,
                CustomerName = null,
                TotalAmount = decimal.TryParse(total, out var t) ? t : 0,
                SubTotal = decimal.TryParse(subtotal, out var st) ? st : 0,
                TaxAmount = decimal.TryParse(taxAmount, out var ta) ? ta : 0,
                DiscountAmount = decimal.TryParse(discountAmount, out var da) ? da : 0,
                PaymentMethod = paymentMethod ?? "cash",
                PaymentStatus = paymentStatus ?? "paid",
                Status = status ?? "completed",
                OrderNumber = orderNumber,
                CashierId = cashierId,
                StoreId = storeId,
                Items = items
            };
            // Nếu có CustomerId, gán lại CustomerName từ bảng Customer
            if (order.CustomerId.HasValue)
            {
                var customer = _context.Customers.FirstOrDefault(c => c.CustomerId == order.CustomerId);
                if (customer != null)
                {
                    order.CustomerName = customer.HoTen;
                }
            }
            _context.Orders.Add(order);
            _context.SaveChanges();
            
            // Tạo thông báo đơn hàng mới
            try
            {
                var notification = new Notification
                {
                    Type = NotificationType.NewOrder,
                    Title = "Đơn hàng mới",
                    Message = $"Khách hàng {order.CustomerName ?? "Vãng lai"} vừa đặt đơn hàng #{order.OrderId}",
                    OrderId = order.OrderId,
                    Metadata = JsonSerializer.Serialize(new
                    {
                        CustomerName = order.CustomerName ?? "Vãng lai",
                        TotalAmount = order.TotalAmount,
                        FormattedTotal = order.TotalAmount.ToString("N0") + "đ",
                        ItemCount = items.Count
                    })
                };
                
                _notificationContext.Notifications.Add(notification);
                _notificationContext.SaveChanges();
            }
            catch (Exception ex)
            {
                // Log error but don't fail the order creation
                Console.WriteLine($"Failed to create notification: {ex.Message}");
            }
            
            return Ok(new { order.OrderId, Status = "Success" });
        }

        [HttpGet]
        public IActionResult GetOrders()
        {
            var orders = _context.Orders
                .Select(o => new {
                    o.OrderId,
                    o.CustomerId,
                    Customer = o.Customer != null ? new {
                        o.Customer.CustomerId,
                        o.Customer.HoTen,
                        o.Customer.SoDienThoai,
                        o.Customer.Email,
                        o.Customer.DiaChi,
                        o.Customer.HangKhachHang
                    } : null,
                    o.CustomerName,
                    o.CreatedAt,
                    o.TotalAmount,
                    Items = o.Items.Select(i => new {
                        i.ProductName,
                        i.Quantity,
                        i.Price,
                        i.TotalPrice
                    }).ToList()
                })
                .OrderByDescending(o => o.OrderId)
                .ToList();
            return Ok(orders);
        }

        // Lấy chi tiết đơn hàng theo ID
        [HttpGet("{id}")]
        public IActionResult GetOrderById(int id)
        {
            var order = _context.Orders
                .Where(o => o.OrderId == id)
                .Select(o => new {
                    o.OrderId,
                    o.CustomerId,
                    Customer = o.Customer != null ? new {
                        o.Customer.CustomerId,
                        o.Customer.HoTen,
                        o.Customer.SoDienThoai,
                        o.Customer.Email,
                        o.Customer.DiaChi,
                        o.Customer.HangKhachHang
                    } : null,
                    o.CustomerName,
                    o.CreatedAt,
                    o.TotalAmount,
                    o.SubTotal,
                    o.TaxAmount,
                    o.DiscountAmount,
                    o.PaymentMethod,
                    o.PaymentStatus,
                    o.Status,
                    o.OrderNumber,
                    o.CashierId,
                    o.StoreId,
                    o.Notes,
                    Items = o.Items.Select(i => new {
                        i.ProductId,
                        i.ProductName,
                        i.Quantity,
                        i.Price,
                        i.TotalPrice
                    }).ToList()
                })
                .FirstOrDefault();
            if (order == null) return NotFound();
            return Ok(order);
        }

        // Cập nhật đơn hàng
        [HttpPut("{id}")]
        public IActionResult UpdateOrder(int id, [FromBody] Order updatedOrder)
        {
            var order = _context.Orders.FirstOrDefault(o => o.OrderId == id);
            if (order == null) return NotFound();
            order.CustomerId = updatedOrder.CustomerId;
            order.CustomerName = updatedOrder.CustomerName;
            order.TotalAmount = updatedOrder.TotalAmount;
            // Nếu muốn cập nhật luôn Items thì cần xử lý thêm ở đây
            _context.SaveChanges();
            return Ok(new { order.OrderId, Status = "Updated" });
        }

        // Xóa đơn hàng
        [HttpDelete("{id}")]
        public IActionResult DeleteOrder(int id)
        {
            var order = _context.Orders.FirstOrDefault(o => o.OrderId == id);
            if (order == null) return NotFound();
            _context.Orders.Remove(order);
            _context.SaveChanges();
            return Ok(new { Status = "Deleted" });
        }
    }
}
