using Microsoft.AspNetCore.Mvc;
using RetailPointBackend.Models;
using System.Linq;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrintConfigController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PrintConfigController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PrintConfig
        [HttpGet]
        public IActionResult GetConfig()
        {
            var config = _context.PrintConfigs.FirstOrDefault();
            if (config == null) return NotFound();
            return Ok(config);
        }

        // POST: api/PrintConfig
        [HttpPost]
        public IActionResult UpsertConfig([FromBody] PrintConfig model)
        {
            var existing = _context.PrintConfigs.FirstOrDefault();
            if (existing != null)
            {
                existing.PrinterName = model.PrinterName;
                existing.PaperSize = model.PaperSize;
                existing.PrintCopies = model.PrintCopies;
                existing.AutoPrintBill = model.AutoPrintBill;
                existing.AutoPrintOnOrder = model.AutoPrintOnOrder;
                existing.PrintBarcode = model.PrintBarcode;
                existing.PrintLogo = model.PrintLogo;
                existing.BillHeader = model.BillHeader;
                existing.BillFooter = model.BillFooter;
                _context.PrintConfigs.Update(existing);
            }
            else
            {
                _context.PrintConfigs.Add(model);
            }
            _context.SaveChanges();
            return Ok(model);
        }
    }
}
