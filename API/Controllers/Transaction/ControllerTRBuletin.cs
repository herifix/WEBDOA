using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerTRBuletin : Controller
    {
        private readonly ServiceTRBuletin service;

        public ControllerTRBuletin(ServiceTRBuletin service)
        {
            this.service = service;
        }

        [HttpGet]
        [Route("Transaction/TRBuletin/GetDataAll")]
        public ResponseData<List<ResponseModelTRBuletin>> GetDataAll()
        {
            return service.GetDataAll();
        }

        [HttpGet]
        [Route("Transaction/TRBuletin/GetDataById")]
        public ResponseData<ResponseModelTRBuletin> GetDataById([FromQuery] long id_buletin)
        {
            return service.GetDataById(id_buletin);
        }

        [HttpPut]
        [Route("Transaction/TRBuletin/Save")]
        public ResponseData<long> Save([FromForm] RequestSaveTRBuletin request)
        {
            return service.Save(request);
        }

        [HttpPut]
        [Route("Transaction/TRBuletin/Delete")]
        public ResponseData<int> Delete([FromBody] RequestDeleteTRBuletin request)
        {
            return service.Delete(request.id_buletin);
        }

        [HttpPost]
        [Route("Transaction/TRBuletin/Publish")]
        public async Task<ResponseData<int>> Publish([FromBody] RequestPublishTRBuletin request, CancellationToken cancellationToken)
        {
            return await service.Publish(request.id_buletin, cancellationToken);
        }
    }
}
