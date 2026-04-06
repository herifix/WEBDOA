using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace API.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    //[ApiExplorerSettings(IgnoreApi = true)] // Hide untuk swagger
    [ApiController]
    [Route("api")]
    public class ControllerMasterItem : Controller
    {

        private readonly IDbConnection conn;
        private readonly ServiceMasterItem ItemService;

        public ControllerMasterItem(IDbConnection db, ServiceMasterItem itemService)
        {
            this.conn = db;
            this.ItemService = itemService;
        }

        iRepoMasterItem repo = new RepoMasterItem();

        //[Authorize] // ✅ butuh token
        [HttpPut]
        [Route("Master/Item/Create")]
        public ResponseData<int> Create(RequestCreateMasterItem bodyRequest)
        {
            return ItemService.CreateData(bodyRequest);
        }

        //[Authorize] // ✅ butuh token
        [HttpPut]
        [Route("Master/Item/Update")]
        public ResponseData<int> Update([FromForm] RequestUpdateMasterItem bodyRequest)
        {
            return ItemService.UpdateData(bodyRequest);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Item/GetDataByName")]
        public ResponseData<List<ResponseModelItemMaster>> GetDataByName(string name)
        {
            return repo.GetDataByName(name, conn);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Item/GetDataByCode")]
        public ResponseData<ResponseModelItemMaster> GetDataByCode(string code)
        {
            return repo.GetDataByCode(code, conn);
        }

        ////[Authorize] // ✅ butuh token
        //[HttpGet]
        //[Route("Master/Item/GetAll")]
        //public ResponseData<List<ResponseModelItemMaster>> GetAll(string Area)
        //{
        //    return ItemService.GetAll(Area);
        //}

        [HttpGet]
        [Route("Master/Item/GetAll")]
        public PagedResponse<ResponseModelItemMaster> GetAll(
            [FromQuery] string Area,
            [FromQuery] int PageNumber = 1,
            [FromQuery] int PageSize = 15,
            [FromQuery] string Search = "")
        {
            var request = new RequestGetAllItemMaster
            {
                Area = Area,
                PageNumber = PageNumber,
                PageSize = PageSize,
                Search = Search ?? ""
            };

            return ItemService.GetAll(request);
        }
    }
    }
