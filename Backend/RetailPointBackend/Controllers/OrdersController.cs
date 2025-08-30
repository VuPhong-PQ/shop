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
            return Ok(order);
        }
    }
}
