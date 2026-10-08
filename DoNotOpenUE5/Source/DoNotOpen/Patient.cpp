#include "Patient.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/KismetMathLibrary.h"

APatient::APatient()
{
	PrimaryActorTick.bCanEverTick = true;

	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("PatientMesh"));
	SetRootComponent(Mesh);
}

void APatient::BeginPlay()
{
	Super::BeginPlay();
	State = EPatientState::Emerge;
	EmergeTimer = 0.0f;
}

void APatient::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	switch (State)
	{
	case EPatientState::Emerge:
		EmergeTimer += DeltaTime;
		if (EmergeTimer >= 4.0f) // 4 second delay before emerging
		{
			State = EPatientState::Chase;
		}
		break;

	case EPatientState::Chase:
		if (CurrentTarget)
		{
			FVector Direction = CurrentTarget->GetActorLocation() - GetActorLocation();
			Direction.Z = 0.0f; // Stay on ground plane
			Direction.Normalize();

			// Simple wall collision check using line trace
			FHitResult Hit;
			GetWorld()->LineTraceSingleByChannel(Hit, 
				GetActorLocation(), 
				GetActorLocation() + Direction * ChaseSpeed * DeltaTime,
				ECC_WorldStatic);

			if (Hit.Distance > ChaseSpeed * DeltaTime)
			{
				AddMovementInput(Direction, 1.0f);
			}
			else
			{
				// Hit wall - try to go around by rotating slightly
				FVector Right = UKismetMathLibrary::GetRightVector(GetActorRotation());
				AddMovementInput(Right, 0.5f);
			}

			// Check if caught player
			if (FVector::Distance(GetActorLocation(), CurrentTarget->GetActorLocation()) < 100.0f)
			{
				GEngine->AddOnScreenDebugMessage(-1, 5.0f, FColor::Red, TEXT("CAUGHT!"));
			}
		}
		break;

	case EPatientState::Roam:
		// Random wandering behavior
		break;

	case EPatientState::Lose:
		State = EPatientState::Roam;
		break;
	}
}

void APatient::StartChasing(AActor* Target)
{
	CurrentTarget = Target;
	State = EPatientState::Chase;
}