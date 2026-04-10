using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerMasterUser : Controller
    {
        private readonly IDbConnection conn;
        private readonly ServiceMasterUser userService;
        private readonly RepoMasterUser repo = new RepoMasterUser();

        public ControllerMasterUser(IDbConnection conn, ServiceMasterUser userService)
        {
            this.conn = conn;
            this.userService = userService;
        }

        [HttpPut]
        [Route("Tools/User/Create")]
        public ResponseData<int> Create([FromForm] RequestCreateMasterUser bodyRequest)
        {
            return userService.CreateData(bodyRequest);
        }

        [HttpPut]
        [Route("Tools/User/Update")]
        public ResponseData<int> Update([FromForm] RequestUpdateMasterUser bodyRequest)
        {
            return userService.UpdateData(bodyRequest);
        }

        [HttpPut]
        [Route("Tools/User/Delete")]
        public ResponseData<int> Delete([FromQuery] string pt, [FromQuery] string userid)
        {
            return userService.DeleteData(pt ?? "", userid ?? "");
        }

        [HttpGet]
        [Route("Tools/User/GetDataById")]
        public ResponseData<ResponseModelMasterUser> GetDataById([FromQuery] string pt, [FromQuery] string userid)
        {
            return repo.GetDataById(pt ?? "", userid ?? "", conn);
        }

        [HttpGet]
        [Route("Tools/User/GetMenuPermissions")]
        public ResponseData<List<ResponseModelMasterUserPermission>> GetMenuPermissions([FromQuery] string pt = "", [FromQuery] string userid = "")
        {
            return new ResponseData<List<ResponseModelMasterUserPermission>>
            {
                success = true,
                message = "OK",
                data = repo.GetMenuPermissions(pt ?? "", userid ?? "", conn)
            };
        }

        [HttpGet]
        [Route("Tools/User/GetDataAll")]
        public PagedResponse<ResponseModelMasterUser> GetDataAll(
            [FromQuery] int PageNumber = 1,
            [FromQuery] int PageSize = 15,
            [FromQuery] string Search = "")
        {
            var request = new RequestGetAllMasterUser
            {
                PageNumber = PageNumber,
                PageSize = PageSize,
                Search = Search ?? ""
            };

            return repo.GetAll(request, conn);
        }

        [HttpPut]
        [Route("Tools/User/ChangePassword")]
        public ResponseData<string> ChangePassword([FromBody] RequestChangePassword bodyRequest)
        {
            return userService.ChangePassword(bodyRequest);
        }

        [HttpGet]
        [Route("Tools/User/GetCurrentPassword")]
        public ResponseData<string> GetCurrentPassword([FromQuery] string pt, [FromQuery] string userid)
        {
            return userService.GetCurrentPassword(pt ?? "", userid ?? "");
        }
    }
}
