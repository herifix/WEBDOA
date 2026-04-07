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
    public class ServiceMasterDonatur
    {
        private readonly IDbConnection conn;
        private readonly RepoMasterDonatur donaturfunc;
        private readonly IWebHostEnvironment _env;

        public ServiceMasterDonatur(IDbConnection conn, RepoMasterDonatur repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.donaturfunc = repo;
            _env = env;
        }

        public ResponseData<int> CreateData(RequestCreateMasterDonatur bodyRequest)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                if (donaturfunc.IsDuplicateNamaDanTglLahir(bodyRequest.nama, bodyRequest.tglLahir, conn, tran))
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data donatur dengan nama dan tanggal lahir yang sama sudah ada.",
                        data = 0
                    };
                }

                response.data = donaturfunc.Create(bodyRequest, conn, tran);

                tran.Commit();

                response.success = true;
                response.message = "Donatur created successfully.";

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

        public ResponseData<int> UpdateData(RequestUpdateMasterDonatur bodyRequest)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var oldData = donaturfunc.GetDataById(bodyRequest.idDonatur, conn, tran).data;
                if (oldData == null || oldData.id_donatur == 0)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data donatur tidak ditemukan.",
                        data = 0
                    };
                }

                if (donaturfunc.IsDuplicateNamaDanTglLahir(bodyRequest.nama, bodyRequest.tglLahir, conn, tran, bodyRequest.idDonatur))
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data donatur dengan nama dan tanggal lahir yang sama sudah ada.",
                        data = 0
                    };
                }

                if (bodyRequest.lastDonation.HasValue &&
                    (!oldData.LastDonation.HasValue || bodyRequest.lastDonation.Value.Date > oldData.LastDonation.Value.Date))
                {
                    bodyRequest.status = true;
                }

                donaturfunc.Update(bodyRequest, conn, tran);

                tran.Commit();

                response.data = 1;
                response.success = true;
                response.message = "Donatur update successfully.";

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

        public ResponseData<int> DeleteData(long idDonatur)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var oldData = donaturfunc.GetDataById(idDonatur, conn, tran).data;
                if (oldData == null || oldData.id_donatur == 0)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data donatur tidak ditemukan.",
                        data = 0
                    };
                }

                donaturfunc.Delete(idDonatur, conn, tran);

                tran.Commit();

                response.data = 1;
                response.success = true;
                response.message = "Donatur delete successfully.";

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
    }
}
