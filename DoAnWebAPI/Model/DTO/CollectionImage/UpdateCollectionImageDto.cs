using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.CollectionImage
{
    public class UpdateCollectionImageDto
    {
        [Required(ErrorMessage = "AddedAt date is required.")]
        [DataType(DataType.DateTime, ErrorMessage = "AddedAt must be a valid date and time.")]
        [CustomDateValidation(ErrorMessage = "AddedAt cannot be in the future.")]
        public DateTime AddedAt { get; set; }
    }
}
