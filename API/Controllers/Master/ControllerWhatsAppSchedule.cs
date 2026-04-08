using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api")]
    public class ControllerWhatsAppSchedule : Controller
    {
        private readonly ServiceWhatsAppSchedule service;

        public ControllerWhatsAppSchedule(ServiceWhatsAppSchedule service)
        {
            this.service = service;
        }

        [HttpGet]
        [Route("Tools/WhatsappSchedule/GetSetting")]
        public ResponseData<ResponseModelWhatsAppSchedule> GetSetting()
        {
            return service.GetSetting();
        }

        [HttpPut]
        [Route("Tools/WhatsappSchedule/Update")]
        public ResponseData<int> Update([FromBody] RequestUpdateWhatsAppSchedule request)
        {
            return service.Update(request);
        }
    }
}
