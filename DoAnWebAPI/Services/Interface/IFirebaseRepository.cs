namespace FirebaseWebApi.Repositories
{
    public interface IFirebaseRepository<T>
    {
        Task<T> CreateAsync(T entity);
        Task<T?> GetByIdAsync(int id);
        Task<List<T>> GetAllAsync();
        Task UpdateAsync(int id, T entity);
        Task DeleteAsync(int id);
    }
}
