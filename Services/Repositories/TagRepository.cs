using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using FirebaseWebApi.Models;

namespace DoAnWebAPI.Services.Repositories
{
    public class TagRepository : ITagRepository
    {
        private readonly FirebaseClient _firebase;

        public TagRepository(FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        public async Task<IEnumerable<TagDTO>> GetAllAsync()
        {
            var data = await _firebase
                .Child("tags")
                .OnceAsync<Tag>();

            return data.Select(d => new TagDTO
            {
                Id = d.Object.Id,
                Name = d.Object.Name,
                Images = new List<ImageDTO>() // nếu cần thì map thêm
            }).ToList();
        }

        public async Task<TagDTO?> GetByIdAsync(string id)
        {
            var tag = await _firebase
                .Child("tags")
                .Child(id)
                .OnceSingleAsync<Tag>();

            if (tag == null) return null;

            return new TagDTO
            {
                Id = tag.Id,
                Name = tag.Name,
                Images = new List<ImageDTO>()
            };
        }

        public async Task<TagDTO> CreateAsync(CreateTagDTO dto)
        {
            var tag = new Tag
            {
                Id = new Random().Next(1, 999999),
                Name = dto.Name
            };

            await _firebase
                .Child("tags")
                .Child(tag.Id.ToString())
                .PutAsync(tag);

            return new TagDTO
            {
                Id = tag.Id,
                Name = tag.Name,
                Images = new List<ImageDTO>()
            };
        }

        public async Task<bool> UpdateAsync(string id, UpdateTagDTO dto)
        {
            var existing = await _firebase
                .Child("tags")
                .Child(id)
                .OnceSingleAsync<Tag>();

            if (existing == null) return false;

            existing.Name = dto.Name ?? existing.Name;

            await _firebase
                .Child("tags")
                .Child(id)
                .PutAsync(existing);

            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var existing = await _firebase
                .Child("tags")
                .Child(id)
                .OnceSingleAsync<Tag>();

            if (existing == null) return false;

            await _firebase
                .Child("tags")
                .Child(id)
                .DeleteAsync();

            return true;
        }
    }
}
