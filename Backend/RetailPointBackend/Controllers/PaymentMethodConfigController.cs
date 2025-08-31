using Microsoft.AspNetCore.Mvc;
using RetailPointBackend.Models;
using System.Linq;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentMethodConfigController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PaymentMethodConfigController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PaymentMethodConfig
        [HttpGet]
        public IActionResult GetConfig()
        {
            var config = _context.PaymentMethodConfigs.FirstOrDefault();
            if (config == null) return NotFound();
            return Ok(config);
        }

        // POST: api/PaymentMethodConfig
        [HttpPost]
        public IActionResult UpsertConfig([FromBody] PaymentMethodConfig model)
        {
            var existing = _context.PaymentMethodConfigs.FirstOrDefault();
            if (existing != null)
            {
                existing.EnableCash = model.EnableCash;
                existing.EnableBankCard = model.EnableBankCard;
                existing.EnableQRCode = model.EnableQRCode;
                existing.EnableEWallet = model.EnableEWallet;
                existing.EnableBankTransfer = model.EnableBankTransfer;
                existing.EnablePartialPayment = model.EnablePartialPayment;
                existing.EnableDrawer = model.EnableDrawer;
                existing.DefaultMethod = model.DefaultMethod;
                _context.PaymentMethodConfigs.Update(existing);
            }
            else
            {
                _context.PaymentMethodConfigs.Add(model);
            }
            _context.SaveChanges();
            return Ok(model);
        }
    }
}
