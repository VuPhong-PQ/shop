using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevController : ControllerBase
    {
        private readonly AppDbContext _context;
        
        public DevController(AppDbContext context)
        {
            _context = context;
        }

        // Temporary endpoint to add Data Management permissions to admin role
        [HttpPost("add-data-management-permissions")]
        public async Task<IActionResult> AddDataManagementPermissions()
        {
            try
            {
                // Get admin role (assuming roleId = 1 or first role)
                var adminRole = await _context.Roles.FirstOrDefaultAsync();
                if (adminRole == null)
                {
                    return BadRequest("No role found");
                }

                // Get Data Management permissions
                var dataManagementPermissions = await _context.Permissions
                    .Where(p => p.Category == "DataManagement")
                    .ToListAsync();

                if (!dataManagementPermissions.Any())
                {
                    return BadRequest("Data Management permissions not found. Make sure SeedDataService has run.");
                }

                // Add permissions to admin role if not already exists
                var addedPermissions = new List<string>();
                
                foreach (var permission in dataManagementPermissions)
                {
                    var exists = await _context.RolePermissions
                        .AnyAsync(rp => rp.RoleId == adminRole.RoleId && rp.PermissionId == permission.PermissionId);
                    
                    if (!exists)
                    {
                        _context.RolePermissions.Add(new RolePermission
                        {
                            RoleId = adminRole.RoleId,
                            PermissionId = permission.PermissionId
                        });
                        addedPermissions.Add(permission.PermissionName);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Data Management permissions added successfully",
                    roleName = adminRole.RoleName,
                    addedPermissions = addedPermissions,
                    allDataManagementPermissions = dataManagementPermissions.Select(p => p.PermissionName).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding permissions", error = ex.Message });
            }
        }

        // Get current user permissions for debugging
        [HttpGet("user-permissions/{staffId}")]
        public async Task<IActionResult> GetUserPermissions(int staffId)
        {
            try
            {
                var staff = await _context.Staffs
                    .Include(s => s.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                    .FirstOrDefaultAsync(s => s.StaffId == staffId);

                if (staff == null)
                {
                    return NotFound("Staff not found");
                }

                object permissions;
                if (staff.Role?.RolePermissions != null)
                {
                    permissions = staff.Role.RolePermissions
                        .Select(rp => new
                        {
                            rp.Permission.PermissionName,
                            rp.Permission.Category,
                            rp.Permission.Description
                        })
                        .ToList();
                }
                else
                {
                    permissions = new List<object>();
                }

                return Ok(new
                {
                    staffId = staff.StaffId,
                    username = staff.Username,
                    roleName = staff.Role?.RoleName,
                    permissions = permissions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting permissions", error = ex.Message });
            }
        }
    }
}