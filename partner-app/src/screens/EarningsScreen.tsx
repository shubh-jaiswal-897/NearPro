import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import api from "../services/api";
import Theme from "../components/Theme";

interface EarningsScreenProps {
  onBack: () => void;
}

export const EarningsScreen: React.FC<EarningsScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    fetchEarningsStats();
  }, []);

  const fetchEarningsStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/workers/stats");
      setStats(response.data.data.stats);
    } catch (e) {
      console.error("Failed to load worker stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Stats</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ${stats ? stats.totalEarnings.toFixed(2) : "0.00"}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {stats?.rating.toFixed(1)} Rating</Text>
          </View>
        </View>

        {/* Transaction History Ledger */}
        <Text style={styles.sectionTitle}>Recent Payout Ledger</Text>
        
        {stats?.earningsHistory.length === 0 ? (
          <Text style={styles.emptyText}>No payouts recorded yet. Start taking jobs to earn.</Text>
        ) : (
          <FlatList
            data={stats?.earningsHistory}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>Home Service Completed</Text>
                  <Text style={styles.historyTime}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.historyPayout}>
                  <Text style={styles.payoutAmount}>+${item.netPayout.toFixed(2)}</Text>
                  <Text style={styles.payoutStatus}>
                    {item.isSettled ? "Settled" : "Pending"}
                  </Text>
                </View>
              </View>
            )}
            style={styles.historyList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  balanceCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  balanceLabel: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  balanceAmount: {
    color: Theme.colors.success,
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: Theme.spacing.xs,
  },
  ratingBadge: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.xl,
  },
  ratingText: {
    color: "#ffc107",
    fontSize: 13,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: "center",
    marginTop: Theme.spacing.xl,
  },
  historyList: {
    flex: 1,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  historyTime: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyPayout: {
    alignItems: "flex-end",
  },
  payoutAmount: {
    color: Theme.colors.success,
    fontSize: 16,
    fontWeight: "bold",
  },
  payoutStatus: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

export default EarningsScreen;
