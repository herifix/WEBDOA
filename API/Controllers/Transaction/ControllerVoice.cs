using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerVoice : Controller
    {
        private readonly ServiceVoiceStorage service;

        public ControllerVoice(ServiceVoiceStorage service)
        {
            this.service = service;
        }

        [HttpPost]
        [Route("voice/upload-mp3")]
        public ResponseData<ResponseModelVoiceRecording> UploadMp3([FromForm] RequestUploadVoiceMp3 request)
        {
            return service.UploadMp3(request);
        }

        [HttpGet]
        [Route("voice/{id:long}/signed-url")]
        public ResponseData<ResponseModelVoiceSignedUrl> GetSignedUrl(long id)
        {
            return service.GetSignedUrl(id);
        }

        [HttpGet]
        [Route("voice/{id:long}/redirect")]
        public IActionResult RedirectToVoice(long id)
        {
            var result = service.GetSignedUrl(id);
            if (!result.success || string.IsNullOrWhiteSpace(result.data?.url))
            {
                return NotFound(result.message);
            }

            return Redirect(result.data.url);
        }
    }
}
