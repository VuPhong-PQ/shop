using System.ComponentModel.DataAnnotations;

namespace RetailPointBackend.Models
{
    public class StoreInfo
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty; // Tên cửa hàng
        public string? Address { get; set; } // Địa chỉ
        public string? TaxCode { get; set; } // Mã số thuế
        public string? Phone { get; set; } // Số điện thoại
        public string? Email { get; set; } // Email liên hệ
    }
}