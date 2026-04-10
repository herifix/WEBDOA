using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerApplicationSetting : Controller
    {
        private readonly ServiceApplicationSetting service;

        public ControllerApplicationSetting(ServiceApplicationSetting service)
        {
            this.service = service;
        }

        [HttpGet]
        [Route("Tools/ApplicationSetting/GetSetting")]
        public ResponseData<ResponseModelApplicationSetting> GetSetting()
        {
            return service.GetSetting();
        }

        [HttpPut]
        [Route("Tools/ApplicationSetting/Update")]
        public ResponseData<int> Update([FromForm] RequestUpdateApplicationSetting request)
        {
            return service.Update(request);
        }
    }
}
