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
    public class ServiceMasterPendoa
    {

        private readonly IDbConnection conn;
        private readonly RepoMasterPendoa Pendoafunc;
        private readonly IWebHostEnvironment _env;

        public ServiceMasterPendoa(IDbConnection conn, RepoMasterPendoa repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.Pendoafunc = repo;
            _env = env;
        }

        
        public ResponseData<int> CreateData(RequestCreateMasterPendoa bodyRequest)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                response.data = Pendoafunc.Create(bodyRequest, conn,tran);

                tran.Commit();

                response.success = true;
                response.message = "Pendoa created successfully.";

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

        public ResponseData<int> UpdateData(RequestUpdateMasterPendoa bodyRequest)
        {

            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var oldData = Pendoafunc.GetDataById (bodyRequest.id_pendoa, conn, tran).data;
                if (oldData == null )
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data item tidak ditemukan.",
                        data = 0
                    };
                }


                Pendoafunc.Update(bodyRequest, conn, tran);

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


        public ResponseData<int> DeleteData(long id_pendoa)
        {

            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var oldData = Pendoafunc.GetDataById(id_pendoa, conn, tran).data;
                if (oldData == null)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data item tidak ditemukan.",
                        data = 0
                    };
                }


                Pendoafunc.Delate(id_pendoa, conn, tran);

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

        //end
    }
}