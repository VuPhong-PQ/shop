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
    }
}
