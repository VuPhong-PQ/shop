using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StoresController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Stores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Store>>> GetStores()
        {
            return await _context.Stores
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        // GET: api/Stores/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Store>> GetStore(int id)
        {
            var store = await _context.Stores.FindAsync(id);

            if (store == null)
            {
                return NotFound();
            }

            return store;
        }

        // POST: api/Stores
        [HttpPost]
        public async Task<ActionResult<Store>> CreateStore(Store store)
        {
            store.CreatedAt = DateTime.Now;
            store.UpdatedAt = DateTime.Now;
            
            _context.Stores.Add(store);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStore), new { id = store.StoreId }, store);
        }

        // PUT: api/Stores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStore(int id, Store store)
        {
            if (id != store.StoreId)
            {
                return BadRequest();
            }

            var existingStore = await _context.Stores.FindAsync(id);
            if (existingStore == null)
            {
                return NotFound();
            }

            existingStore.Name = store.Name;
            existingStore.Address = store.Address;
            existingStore.Phone = store.Phone;
            existingStore.Email = store.Email;
            existingStore.TaxCode = store.TaxCode;
            existingStore.Manager = store.Manager;
            existingStore.IsActive = store.IsActive;
            existingStore.Notes = store.Notes;
            existingStore.UpdatedAt = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StoreExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Stores/5 (Soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStore(int id)
        {
            var store = await _context.Stores.FindAsync(id);
            if (store == null)
            {
                return NotFound();
            }

            // Check if store has staff assigned
            var hasStaff = await _context.Staffs.AnyAsync(s => s.StoreId == id && s.IsActive);
            if (hasStaff)
            {
                return BadRequest("Không thể xóa cửa hàng có nhân viên đang hoạt động");
            }

            store.IsActive = false;
            store.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Stores/{id}/staff
        [HttpGet("{id}/staff")]
        public async Task<ActionResult<IEnumerable<Staff>>> GetStoreStaff(int id)
        {
            var storeExists = await _context.Stores.AnyAsync(s => s.StoreId == id && s.IsActive);
            if (!storeExists)
            {
                return NotFound("Store not found");
            }

            var staff = await _context.Staffs
                .Include(s => s.Role)
                .Where(s => s.StoreId == id && s.IsActive)
                .OrderBy(s => s.FullName)
                .ToListAsync();

            return staff;
        }

        private bool StoreExists(int id)
        {
            return _context.Stores.Any(e => e.StoreId == id);
        }
    }
}