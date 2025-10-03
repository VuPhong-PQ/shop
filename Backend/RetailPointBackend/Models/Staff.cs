using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetailPointBackend.Models
{
    public class Staff
    {
        [Key]
        public int StaffId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(256)]
        public string PasswordHash { get; set; } = string.Empty;
        
        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }
        
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        
        [ForeignKey("Role")]
        public int RoleId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? LastLogin { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        // Navigation properties
        public virtual Role Role { get; set; } = null!;
        
        // Computed properties
        [NotMapped]
        public string RoleName => Role?.RoleName ?? "";
        
        [NotMapped]
        public bool IsAdmin => Role?.RoleName == "Admin";
        
        [NotMapped]
        public bool IsCashier => Role?.RoleName == "Thu ngân";
    }
}