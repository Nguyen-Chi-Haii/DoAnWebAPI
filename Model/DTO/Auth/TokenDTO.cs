using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.Auth
{
    public class TokenDTO
    {
        [Required(ErrorMessage = "Token là bắt buộc trong body.")]
        public string Token { get; set; }
    }
}