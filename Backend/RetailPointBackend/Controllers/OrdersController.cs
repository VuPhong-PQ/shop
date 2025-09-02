using Microsoft.AspNetCore.Mvc;
using RetailPointBackend.Models;
using System.Linq;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly RetailPointContext _context;
        public OrdersController(RetailPointContext context)
        {
            _context = context;
        }

        [HttpPost]
        public IActionResult CreateOrder([FromBody] Order order)
        {
            if (order == null || order.Items == null || !order.Items.Any())
                return BadRequest("Order or items missing");

            // Tính tổng tiền đơn hàng
            order.TotalAmount = order.Items.Sum(item => item.Quantity * item.Price);

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
            // Trả về thông tin đơn giản, tránh trả về navigation property gây vòng lặp
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
                    Items = o.Items.Select(i => new {
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
