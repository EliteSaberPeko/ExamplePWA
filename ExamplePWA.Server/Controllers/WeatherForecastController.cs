using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Threading.Tasks;

namespace ExamplePWA.Server.Controllers
{
    [ApiController]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet("api/[controller]")]
        public IEnumerable<WeatherForecast> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }

        [HttpPost("api/[controller]")]
        public async Task<MessageViewModel> Post(MessageViewModel model)
        {
            if (model == null || model.Message == null)
            {
                Response.StatusCode = 400;
                return new MessageViewModel();
            }
            await System.IO.File.AppendAllLinesAsync("wwwroot/message.txt", [model.Message], Encoding.UTF8);
            Response.StatusCode = 201;
            return model;
        }

        [HttpGet("api/[controller]/[action]")]
        public async Task<IEnumerable<string>> Messages()
        {
            const string path = "wwwroot/message.txt";
            var isExist = System.IO.File.Exists(path);
            var messages = isExist ? await System.IO.File.ReadAllLinesAsync(path, Encoding.UTF8) : [];
            return messages;
        }

        public class MessageViewModel
        {
            public string Message { get; set; } = string.Empty;
        }
    }
}
