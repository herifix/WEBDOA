using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace API.Controllers
{
    //[ApiExplorerSettings(IgnoreApi = true)] // Hide untuk swagger
    [ApiController]
    [Route("api")]
    public class ControllerMasterPendoa: Controller
    {
        private readonly IDbConnection conn;
        private readonly ServiceMasterPendoa PendoaService;

        public ControllerMasterPendoa(IDbConnection db, ServiceMasterPendoa pendoaService)
        {
            this.conn = db;
            this.PendoaService = pendoaService;
        }

        private readonly RepoMasterPendoa repo = new RepoMasterPendoa();

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Pendoa/GetDataById")]
        public ResponseData<ResponseModelMasterPendoa> GetDataById(long id_pendoa)
        {
            return repo.GetDataById(id_pendoa, conn);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Pendoa/GetDataAll")]
        public PagedResponse<ResponseModelMasterPendoa> GetDataAll(
            [FromQuery] int PageNumber = 1,
            [FromQuery] int PageSize = 15,
            [FromQuery] string Search = ""
        )
        {
            var request = new RequestGetAllMasterPendoa
            {
                PageNumber = PageNumber,
                PageSize = PageSize,
                Search = Search ?? ""
            };
            return repo.GetAll(request,conn);
        }
    }
}