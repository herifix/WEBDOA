using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Data;
using static System.Net.Mime.MediaTypeNames;

namespace API.Service.Master
{
    public class ServiceMasterItem
    {
        
        private readonly IDbConnection conn;
        private readonly RepoMasterItem itemfunc;
        private readonly IWebHostEnvironment _env;

        public ServiceMasterItem(IDbConnection conn, RepoMasterItem repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.itemfunc = repo;
            _env = env;
        }

        public ResponseData<int> CreateData(RequestCreateMasterItem bodyRequest)
        {
            var response = new ResponseData<int> { data = 0};

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                response.data = itemfunc.CreateItemMaster(bodyRequest, conn);

                tran.Commit();

                response.success =true ;
                response.message = "Item created successfully.";

                return response;
            }
            catch (Exception ex)
            {
                tran.Rollback();

                return new ResponseData<int>
                {
                    success = false,
                    message = ex.Message
                };
            }
        }

        public ResponseData<int> UpdateData(RequestUpdateMasterItem bodyRequest)
        {
            
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                // bersihkan code dari karakter ilegal nama file
                var ext = Path.GetExtension(bodyRequest.img1File.FileName);
                var invalidChars = Path.GetInvalidFileNameChars();
                var safeCode = new string(bodyRequest.code
                    .Where(c => !invalidChars.Contains(c))
                    .ToArray());

                var fileName = $"{safeCode}{ext}";

                var oldData = itemfunc.GetDataByCode(bodyRequest.code, conn, tran).data;
                if (oldData == null && oldData.img1!= fileName)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data item tidak ditemukan.",
                        data = 0
                    };
                }

                if (bodyRequest.img1 != null && bodyRequest.img1 != "")
                {
                    var folder = Path.Combine(_env.WebRootPath, "uploads", "items");
                    
                    if (!Directory.Exists(folder))
                    {
                        Directory.CreateDirectory(folder);
                    }



                    var filePath = Path.Combine(folder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        bodyRequest.img1File.CopyTo(stream);
                    }

                    bodyRequest.img1 = fileName;
                }
                else { bodyRequest.img1 = ""; }

                itemfunc.UpdateItemMaster(bodyRequest, conn, tran);

                tran.Commit();

                response.data = 1;
                response.success = true;
                response.message = "Item update successfully.";

                return response;
            }
            catch (Exception ex)
            {
                tran.Rollback();

                return new ResponseData<int>
                {
                    success = false,
                    message = ex.Message,
                    data = 0
                };
            }
        }

        public PagedResponse<ResponseModelItemMaster> GetAll(RequestGetAllItemMaster request)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return itemfunc.GetAll(request, conn);
            }
            catch (Exception ex)
            {
                return new PagedResponse<ResponseModelItemMaster>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelItemMaster>(),
                    pageNumber = request.PageNumber,
                    pageSize = request.PageSize,
                    totalRecords = 0,
                    totalPages = 0
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }


        //public ResponseData<List<ResponseModelItemMaster>> GetAll(string Area)
        //{
        //    var response = new ResponseData<List<ResponseModelItemMaster>>();

        //    if (conn.State == ConnectionState.Closed)
        //        conn.Open();

        //    try
        //    {
        //        var repoResponse = itemfunc.GetAll(Area, conn);
        //        response.data = repoResponse.data;
        //        response.success = repoResponse.success;
        //        response.message = repoResponse.message;

        //        return response;
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ResponseData<List<ResponseModelItemMaster>>
        //        {
        //            success = false,
        //            message = ex.Message
        //        };
        //    }
        //}
    }
}
