using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly RetailPointContext _context;
        public CustomersController(RetailPointContext context)
        {
            _context = context;
        }

        // GET: api/customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            return await _context.Customers.ToListAsync();
        }

        // POST: api/customers
        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] Customer customer)
        {
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return Ok(customer);
        }

        // PUT: api/customers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
        {
            if (id != customer.CustomerId) return BadRequest();
            _context.Entry(customer).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/customers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
