# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ExpenseTracker.sln ./
COPY src/ExpenseTracker.Api/ExpenseTracker.Api.csproj src/ExpenseTracker.Api/
COPY src/ExpenseTracker.Core/ExpenseTracker.Core.csproj src/ExpenseTracker.Core/
COPY src/ExpenseTracker.Infrastructure/ExpenseTracker.Infrastructure.csproj src/ExpenseTracker.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY . .

# Build
RUN dotnet build -c Release --no-restore

# Publish
RUN dotnet publish src/ExpenseTracker.Api/ExpenseTracker.Api.csproj -c Release -o /app/publish --no-build

# Development stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development
WORKDIR /app

# Install dotnet-watch
RUN dotnet tool install --global dotnet-watch
ENV PATH="${PATH}:/root/.dotnet/tools"

# Copy project files for restore
COPY ExpenseTracker.sln ./
COPY src/ExpenseTracker.Api/ExpenseTracker.Api.csproj src/ExpenseTracker.Api/
COPY src/ExpenseTracker.Core/ExpenseTracker.Core.csproj src/ExpenseTracker.Core/
COPY src/ExpenseTracker.Infrastructure/ExpenseTracker.Infrastructure.csproj src/ExpenseTracker.Infrastructure/

RUN dotnet restore

# Source code will be mounted as volume
EXPOSE 8080

# Production runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ExpenseTracker.Api.dll"]
