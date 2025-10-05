using DoAnWebAPI.Model.DTO.Collection;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/collections
    public class CollectionsController : ControllerBase
    {
        private readonly ICollectionRepository _collectionRepository;
        private readonly ICollectionImageRepository _collectionImageRepository;
        private readonly IImageRepository _imageRepository;

        public CollectionsController(ICollectionRepository collectionRepository, ICollectionImageRepository collectionImageRepository, IImageRepository imageRepository)
        {
            _collectionRepository = collectionRepository;
            _collectionImageRepository = collectionImageRepository;
            _imageRepository = imageRepository;
        }

        // Helper to map Domain model to DTO
        private async Task<CollectionDTO> MapToDTO(Model.Collection collection)
        {
            var imageLinks = await _collectionImageRepository.GetImagesByCollectionIdAsync(collection.Id);
            var imageDtos = new List<Model.DTO.Image.ImageDTO>();

            // WARNING: Inefficient. This retrieves every image one by one. Optimize in a production environment.
            foreach (var link in imageLinks)
            {
                var imageDto = await _imageRepository.GetByIdAsync(link.ImageId.ToString());
                if (imageDto != null)
                {
                    imageDtos.Add(imageDto);
                }
            }

            return new CollectionDTO
            {
                Id = collection.Id,
                UserId = collection.UserId,
                Name = collection.Name,
                IsPublic = collection.IsPublic,
                Images = imageDtos
            };
        }

        // GET /api/collections
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CollectionDTO>>> GetAll()
        {
            var collections = await _collectionRepository.GetAllAsync();
            var dtos = new List<CollectionDTO>();
            foreach (var collection in collections)
            {
                // Only return public collections (simple filter)
                if (collection.IsPublic)
                {
                    dtos.Add(await MapToDTO(collection));
                }
            }
            return Ok(dtos);
        }

        // GET /api/collections/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CollectionDTO>> GetById(int id)
        {
            var collection = await _collectionRepository.GetByIdAsync(id);
            if (collection == null) return NotFound();

            var dto = await MapToDTO(collection);
            return Ok(dto);
        }

        // POST /api/collections
        [HttpPost]
        public async Task<ActionResult<CollectionDTO>> Create(CreateCollectionDTO dto)
        {
            var createdCollection = await _collectionRepository.CreateAsync(dto);
            var responseDto = await MapToDTO(createdCollection);
            return CreatedAtAction(nameof(GetById), new { id = responseDto.Id }, responseDto);
        }

        // PUT /api/collections/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCollectionDTO dto)
        {
            var result = await _collectionRepository.UpdateAsync(id, dto);
            if (result == null) return NotFound();
            return NoContent();
        }

        // DELETE /api/collections/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _collectionRepository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}