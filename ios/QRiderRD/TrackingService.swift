import Foundation
import CoreLocation
import UIKit

@objc(TrackingService)
class TrackingService: NSObject, CLLocationManagerDelegate {
  private var locationManager: CLLocationManager?
  private var isTracking = false

  override init() {
    super.init()
    setupLocationManager()
  }

  private func setupLocationManager() {
    locationManager = CLLocationManager()
    locationManager?.delegate = self
    locationManager?.desiredAccuracy = kCLLocationAccuracyBest
    locationManager?.distanceFilter = 10
    locationManager?.allowsBackgroundLocationUpdates = true
    locationManager?.pausesLocationUpdatesAutomatically = false
    locationManager?.showsBackgroundLocationIndicator = true
  }

  @objc func startTracking() {
    guard let locationManager = locationManager else { return }

    locationManager.requestAlwaysAuthorization()

    if CLLocationManager.locationServicesEnabled() {
      locationManager.startUpdatingLocation()
      locationManager.startMonitoringSignificantLocationChanges()
      isTracking = true
      print("TrackingService: Started location tracking")
    } else {
      print("TrackingService: Location services are not enabled")
    }
  }

  @objc func stopTracking() {
    guard let locationManager = locationManager else { return }

    locationManager.stopUpdatingLocation()
    locationManager.stopMonitoringSignificantLocationChanges()
    isTracking = false
    print("TrackingService: Stopped location tracking")
  }

  @objc func isServiceRunning(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(isTracking)
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last else { return }

    print("TrackingService: Location updated - Lat: \(location.coordinate.latitude), Lon: \(location.coordinate.longitude)")

    NotificationCenter.default.post(
      name: NSNotification.Name("LocationUpdate"),
      object: nil,
      userInfo: [
        "latitude": location.coordinate.latitude,
        "longitude": location.coordinate.longitude,
        "accuracy": location.horizontalAccuracy,
        "timestamp": location.timestamp.timeIntervalSince1970
      ]
    )
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("TrackingService: Location error - \(error.localizedDescription)")
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    switch status {
    case .authorizedAlways, .authorizedWhenInUse:
      print("TrackingService: Location permission granted")
    case .denied, .restricted:
      print("TrackingService: Location permission denied")
    case .notDetermined:
      print("TrackingService: Location permission not determined")
    @unknown default:
      break
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
