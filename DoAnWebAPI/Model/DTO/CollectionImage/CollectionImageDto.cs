using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.CollectionImage
{
    public class CollectionImageDto
    {
        [Required(ErrorMessage = "Image ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Image ID must be a positive integer.")]
        public int ImageId { get; set; }

        [Required(ErrorMessage = "AddedAt date is required.")]
        [DataType(DataType.DateTime, ErrorMessage = "AddedAt must be a valid date and time.")]
        [CustomDateValidation(ErrorMessage = "AddedAt cannot be in the future.")]
        public DateTime AddedAt { get; set; }
    }
    public class CustomDateValidationAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value is DateTime date && date > DateTime.UtcNow)
            {
                return new ValidationResult(ErrorMessage);
            }
            return ValidationResult.Success;
        }
    }
}
