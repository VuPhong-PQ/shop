using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductGroupsController : ControllerBase
    {
        private readonly AppDbContext _context;
        
        public ProductGroupsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductGroup>>> GetProductGroups()
        {
            try
            {
                Console.WriteLine("Getting product groups...");
                var groups = await _context.ProductGroups.ToListAsync();
                Console.WriteLine($"Found {groups.Count} product groups");
                return groups;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting product groups: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách nhóm sản phẩm", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProductGroup([FromBody] ProductGroup group)
        {
            try
            {
                Console.WriteLine($"Creating product group: {group.Name}");
                
                if (string.IsNullOrEmpty(group.Name))
                {
                    return BadRequest(new { message = "Tên nhóm sản phẩm là bắt buộc" });
                }

                _context.ProductGroups.Add(group);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Product group created with ID: {group.ProductGroupId}");
                return CreatedAtAction(nameof(GetProductGroup), new { id = group.ProductGroupId }, group);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating product group: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Không thể tạo nhóm sản phẩm", error = ex.Message });
            }
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
