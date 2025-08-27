using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductGroupsController : ControllerBase
    {
        private readonly RetailPointContext _context;
        public ProductGroupsController(RetailPointContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProductGroup([FromBody] ProductGroup group)
        {
            _context.ProductGroups.Add(group);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductGroup), new { id = group.ProductGroupId }, group);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductGroup>> GetProductGroup(int id)
        {
            var group = await _context.ProductGroups.FindAsync(id);
            if (group == null) return NotFound();
            return group;
        }
    }
}
